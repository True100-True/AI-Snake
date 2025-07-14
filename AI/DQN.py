import torch 
import torch.nn as nn
import torch.functional as f
import torch.optim as optim
import numpy as np

import socket
import json
import random
from time import sleep

from collections import deque

import matplotlib.pyplot as plt

AI_STATS = {
    "name":"DQN1AI",
    "training":"yes",
}

class Communication:
    @staticmethod
    def send_data(data):
        with socket.create_connection(("127.0.0.1", 4567)) as sock: # http://127.0.0.1:4567/
            data_send = (
                "POST /ai HTTP/1.1\r\n",
                "Host: 127.0.0.1:4567\r\n",
                "Content-Type: application/json\r\n",
                f"Content-Length: {len(json.dumps(data))}\r\n\r\n",
                f"{json.dumps(data)}"
            )
            sock.sendall("".join(data_send).encode())
            response = sock.recv(4096)
            return response.decode()
    @staticmethod
    def convertor(action):
        ACTIONS = {
            0:(0, -1), # UP
            1:(0, 1), # DOWN
            2:(-1, 0), # LEFT
            3:(1, 0)  # RIGHT
        }
        return ACTIONS[action]

class DQN(nn.Module):
    def __init__(self):
        super(DQN, self).__init__()
        self.fc1 = nn.Linear(900, 256)
        self.fc2 = nn.Linear(256, 64)
        self.fc3 = nn.Linear(64, 4)
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

def parse_coord(coord_str):
    x_str, y_str = coord_str.lower().split('x')
    return int(x_str), int(y_str)

def create_grid(snake_coords_str, apple_coords_str, grid_size=30):
    snake_coords = parse_coord(snake_coords_str)
    apple_coords = parse_coord(apple_coords_str)
    
    grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    
    if 0 <= snake_coords[0] < grid_size and 0 <= snake_coords[1] < grid_size:
        grid[snake_coords[0]][snake_coords[1]] = 1
    else:
        print(f"Warning: Snake coord out of range: {(snake_coords[0], snake_coords[1])}")

    grid[apple_coords[1]][apple_coords[0]] = 2
    
    return grid


class ReplayMemory:
    def __init__(self, capacity):
        self.memory = deque(maxlen=capacity)  # automatically discards oldest

    def push(self, experience):
        # experience = (state, action, reward, next_state, done)
        self.memory.append(experience)

    def sample(self, batch_size):
        return random.sample(self.memory, batch_size)

    def __len__(self):
        return len(self.memory)

def train(episodes, epsilone=1, epsilone_decay_rate=0.01, small_batch_size=64, gamma=0.99, target_update_rate=6, learning_rate=0.001, create_learning_curve=False):
    target_net = DQN()
    policy_net = DQN()

    target_net.load_state_dict(policy_net.state_dict())

    D = ReplayMemory(10000)

    done_ = False

    snake_coords = 0
    apple_coords = 0

    #$$$ ENV $$$
    payload = {
        "name":AI_STATS["name"],
        "training":AI_STATS["training"],
        "status":"run",
        "direction_x":0,
        "direction_y":0
    }

    loss_fn = nn.MSELoss()
    optimizer = optim.Adam(policy_net.parameters(), lr=learning_rate)

    env = Communication()
    
    #$$$ matplotlib $$$
    reward_track = []

    for episode in range(episodes):
        print(f"Starting episode: {episode}/{episodes}...")

        response = env.send_data(payload)
        env_data = json.loads(response.split("\r\n\r\n")[1])

        print("received env_data:", env_data)

        snake_coords = env_data['response']['head']
        apple_coords = env_data['response']['apple']

        game_over_ = env_data['response']['game_over']
        game_won_ = env_data['response']['game_won']
        
        step = 0

        total_reward = 0

        array = create_grid(snake_coords, apple_coords)
        state = torch.tensor(np.array(array).flatten(), dtype=torch.float32).unsqueeze(0)
        
        game_won = False
        game_over = False
        
        while not (game_over or game_won):
            step += 1
            if random.random() < epsilone:
                action = random.randint(0, 3)
            else:
                with torch.no_grad():
                    array = create_grid(snake_coords, apple_coords)
                    state = torch.tensor(np.array(array).flatten(), dtype=torch.float32).unsqueeze(0)
                    q_values = policy_net(state)
                    action = torch.argmax(q_values).item()

            # Send data to enviroment / retrive data from enviroment
            x, y = env.convertor(action)
            payload = {
                "name":AI_STATS["name"],
                "training":"yes",
                "status":"run",
                "direction_x":int(x),
                "direction_y":int(y)
            }
            
            raw_response = env.send_data(payload)
            try:
                body = raw_response.split("\r\n\r\n", 1)[1]
                data = json.loads(body)
            except Exception as e:
                print(f"Error: {e}")

            snake_coords = data['response']['head']
            apple_coords = data['response']['apple']

            reward = 0
            done_ = False
            array = create_grid(snake_coords, apple_coords)
            next_state = torch.tensor(
                np.array(array).flatten(),
                dtype=torch.float32
            ).unsqueeze(0)

            game_over_ = data['response']['game_over']
            game_won_ = data['response']['game_won']

            if game_won_:
                reward += 1
                done_ = True
                print("Snake won!")
            if game_over_:
                reward += -1
                done_ = True
                print("Snake lost!")
            
            total_reward += reward
            
            D.push((state, action, reward, next_state, done_))

            if done_:
                break
            
            if len(D.memory) >= small_batch_size:
                batch = D.sample(small_batch_size)
            else:
                batch = D.sample(len(D.memory))

            for (s, a, r, ns, d) in batch:
                with torch.no_grad():
                    if d:
                        target_q = torch.tensor([r], dtype=torch.float32)
                    else:
                        max_next_q = torch.max(target_net(ns))
                        target_q = torch.tensor([r + gamma * max_next_q.item()], dtype=torch.float32)

                predicted_q = policy_net(s)[0, a]
                loss = loss_fn(predicted_q.unsqueeze(0), target_q)

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                # This will train them ? IDK, Welp It makes sense tho
            state = next_state
            if step % target_update_rate == 0:
                target_net.load_state_dict(policy_net.state_dict())

        epsilone -= epsilone_decay_rate

        reward_track.append(total_reward)

        sleep(0.2) # communication reason
    if create_learning_curve:
        plt.figure(figsize=(10, 5))
        plt.plot(total_reward, label='Learning curve (by reward sys)')
        plt.xlabel("Episode")
        plt.ylabel("Total Reward")
        plt.title("DQN Learning Curve")
        plt.legend()
        plt.grid(True)

        plt.savefig("learning_curve.png")
        plt.show()
    torch.save(policy_net.state_dict(), 'AIs/learned_AI.pth')

if __name__ == "__main__":
    print("Teaching machine ...")
    train(episodes=300, create_learning_curve=True)