# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  config.vm.provider "docker" do |d|
    d.image = "ubuntu:latest"  # You can use any Docker image you prefer
    d.has_ssh = true
    d.cmd = ["tail", "-f", "/dev/null"]  # Keeps the container running
  end
end

