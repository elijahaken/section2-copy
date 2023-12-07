#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d provo.us-east-2.elasticbeanstalk.com  --nginx --agree-tos --email lst28@byu.edu
