#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d makeprovohealthy.is404.net --nginx --agree-tos --email lst28@byu.edu
