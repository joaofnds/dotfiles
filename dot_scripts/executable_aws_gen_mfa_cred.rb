#!/usr/bin/env ruby

require 'json'
require 'inifile'
require 'English'

aws_mfa_arn = `printenv | fzf | cut -d= -f2`.chomp

if aws_mfa_arn.empty?
  puts 'Please select an ARN from your env.'
  exit 1
end

print 'profile: '
profile = gets.chomp

print 'MFA token: '
token = gets.chomp

out = `aws \
       --profile stag \
       sts get-session-token \
       --duration-seconds 86400 \
       --serial-number #{aws_mfa_arn} \
       --token-code #{token}`

unless $CHILD_STATUS.success?
  puts out
  exit $CHILD_STATUS.exitstatus
end

creds = JSON.parse(out)['Credentials']

config = IniFile.load(File.join(ENV['HOME'], '.aws', 'credentials'))
config[profile] = {
  aws_access_key_id: creds['AccessKeyId'],
  aws_secret_access_key: creds['SecretAccessKey'],
  aws_session_token: creds['SessionToken']
}
config.save
