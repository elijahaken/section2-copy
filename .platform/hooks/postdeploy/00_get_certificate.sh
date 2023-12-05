#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d group14ftw.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email cstokes1@byu.edu