require 'sinatra'
require 'json'

set :public_folder, 'frontend'

get '/' do
  erb :index
end

$latest_data = nil
$response = nil

post '/ai' do
  content_type :json
  begin
    data = JSON.parse(request.body.read)
    $latest_data = data
    { response: $response }.to_json
  rescue JSON::ParserError
    status 400
    { status: 'error', message: 'Invalid JSON' }.to_json
  end
end

get '/ai-latest' do
  content_type :json
  { latest: $latest_data }.to_json
end

post '/ai-response' do 
  content_type :json
  begin
    data = JSON.parse(request.body.read)

    if data['del_latest'] == true
      put "deleting latest"
      latest_data = nil
      { status: 'success', message: 'receaved successfully', code: '1' }.to_json
    end

    $response = data
    { status: 'success', message: 'receaved successfully', code: '1' }.to_json
  rescue JSON::ParserError
    status 400
    { status: 'error', message: 'Invalid JSON', code: '3' }.to_json
  end
end

get '/ai-response' do
  content_type :json
  $response.to_json
end