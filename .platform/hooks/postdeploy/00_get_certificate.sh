#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d provosmentalhealth.us-east-2.elasticbeanstalk.com --nginx --agree-tos --email cstokes1@byu.edu