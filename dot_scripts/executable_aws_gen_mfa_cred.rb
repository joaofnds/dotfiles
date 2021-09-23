#!/usr/bin/env ruby

require 'json'
require 'inifile'

aws_mfa_arn = `printenv | fzf --prompt "arn: " | cut -d= -f2`.chomp

if aws_mfa_arn.empty?
  puts 'Please select an ARN from your env.'
  exit 1
end

puts "arn: #{aws_mfa_arn}"

config = IniFile.load(File.join(ENV['HOME'], '.aws', 'credentials'))
profiles = config.to_h.keys

profile = `fzf --height 10% --prompt="base profile:" <<< "#{profiles.join("\n")}"`.chomp
puts "profile: #{profile}"

print 'mfa token: '
token = gets.chomp

session_token = `aws \
       --profile #{profile} \
       sts get-session-token \
       --duration-seconds 86400 \
       --serial-number #{aws_mfa_arn} \
       --token-code #{token}`

unless $?.success?
  puts session_token
  exit $?.exitstatus
end

creds = JSON.parse(session_token)['Credentials']

config["#{profile}_temp"] = {
  aws_access_key_id: creds['AccessKeyId'],
  aws_secret_access_key: creds['SecretAccessKey'],
  aws_session_token: creds['SessionToken']
}
config.save
