<a id="readme-top"></a>

<br />
<div align="center">
  <h2 align="center">Hello, guy!</h2>
  <h1 align="center">DQN AI Snake Game<h1>
</div>

### Start
This is an AI Snake, I mentioned it like tweny times I know.
This project has in it:
* DQN NN:
    DQN neural network with greedy algorithm, target/policy function, automated training.
* Snake Game:
    Classic snake game like old nokia had, all thoght it has some issues.
* Server:
    Basic server hosted using framework `Sinatra` in Ruby.
This is everthing in the project I will explain the rest down here.

### BACKEND
Oww how we love backend do we ?
This project uses really unsecure techniques how can Server communicate with Client and AI.
It works like this:
* 1. Client/Frontend will read /ai-latest for any connected AI's 
* 2. Server will host <strong>3</strong> of paths for AI
* 3. AI Communication system will send json of info, example (python variable):
    ```python
    payload = {
        "name":"SimpleAI",
        "training":"no",
        "status":"run",
        "direction_x":0,
        "direction_y":0
    }
    ```
    Or in JSON:
    ```json
    {
        "name":"SimpleAI",
        "training":"no",
        "status":"run",
        "direction_x":0,
        "direction_y":0
    }
    ```
    Program will read this JSON and will use ALL values.
    I will inform you more just keep reading.
* 4. Final.
    - AI will send info about its existense to `/ai` in JSON format like I mentioned
    - Server will read it and post it on `/ai-latest` in JSON format for Client
    - Client will read `/ai-latest` and will move Snake as AI needs.
    - Client will post response on `/ai-response` in once again JSON format for AI.<br>
    <strong>This process repeats with 0.2 second delay</strong>

### Frontend
Artistic one hm?<br>
This project uses basics nothing to talk about here.<br>
All info about grid are shown on web (frontend) unless you change it.<br>

### AI-Communication
AI uses raw socket to post and receaive data from Server.<br>
AI always will send `startup-payload` it is the same payload as I shown before.<br>
This startup payload will send all of the info like `direction_x`, `direction_y` but with 0 values.<br>
All of those metadata like name, training, status <strong>MUST</strong> be mentioned<br>
In main_loop always put delay of 0.2 seconds to prevent any un-sync (not being synchronized).

### Server
Tuff guy that holds it all.<br>
To run this you need ruby!

### Requires to run
* Libs
    1. Sinatra
        ```sh
        gem install sinatra
        ```
        Sometimes they will be error that puma is not installed then:
        ```sh
        gem install puma
        ```
    2. Python DQN example
        - For this one use Python 3.13 (2025 - latest)
        - Use:
            - NumPy:
                ```sh 
                pip install numpy 
                ```
                Or for Linux
                ```sh 
                python3 -m venv MyEnv
                source MyEnv/bin/activate 
                python3 -m pip install numpy 
                ```
            - Torch/Pytorch
                - ```sh
                pip install pytorch
                ```
                - Or for Linux
                - ```sh
                python3 -m venv MyEnv # Assuming if you already did this ignore
                source MyEnv/bin/activate
                python3 -m pip install pytoch
                ```
            Matplotlib:
                ```sh
                pip install matplotlib
                ```
                Our Linus friends
                ```sh
                # Same thing
                python3 -m pip install matplotlib
                ```
        - This is everthing you need for python DQN example 
    3. JS
        - I just used browser for this one.
    <strong>Use this command to install everthing (ONLY LINUX):</strong>
    - ```sh
    sudo apt-get update
    sudo apt-get install ruby python3 python3-venv python3-pip firefox -y # Check it and delete what you dont need
    gem install sinatra 
    gem install puma # optional if sinatra throws error while testing !!!
    sudo python3 -m venv MyEnv
    source MyEnv/bin/activate
    python3 -m pip install numpy pytorch matplotlib
    ```
2. Run
    - To run this Program you need to first run server (Wow no sht!)
    - To run it use:
        - ```sh
        ruby server.rb
        ```
    - Then when your server is running check:
        - ```sh
        start firefox "127.0.0.1:4576"
        ```
    - Now when you have your client runnin, run this:
        - ```sh
        python3 DQN.py
        ```
        - For any errors I am sorry.
        - The DQN will start only when the Client is running ans try to run it multiple times until it works
    - The DQN "template" (only if you want to modify it) when start is automaticly in train mode to change this wait for next update :).
    - In future I plan it to save models progress and load it when wanted.
3. Hope
    - If you have religion pray, pray I mean it
    - If not then get one (if you want)
        - Do you want christianity ?
        - here:
            - [Your-name], ego te baptizo in nomine Patris et Filii et Spiritus Sancti.
            - *pouring water at you*
        - (!!!NOT A JOKE!!!)

### More about
I programed this on Windows so I had my limitations.<br>
Here is my aproven that you can use my project as a template but please be kind and always leave my name at the bottom like:<br>
    Thanks to TheBlackDev for a template.<br>
I recommend good PC that can hold Basic DoS because of the AI Communication.<br>
If tuning settings like `setInterval` you need to have AI update interval (that 0.2 seconds) below players update interval<br>
Good luck with tuning, modifing, injecting diffrent model.<br>
<h4 align="center">I do not recommend publishing it as a accessable web.</h3>

## This is end
<h3 align="center">Thank you for downloading my project, it helps a lot!</h3>
<h4 align="center">If you want to support me at this, donate.</h4>
<strong align="center">Donate here (I know it is XMR)</strong>
<h5 align="center">43tqYMbacbHViWDHtVJcVBHUaPuo5SjxZR8K3kCiNbsjeJKacapjWQGLdehCv9dA5shihNSXPF1K2WM9UQ648nQmEG3x8dX</h5>

