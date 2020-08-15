# raspberry-wifi-conf

A Node application which makes connecting your Raspberry Pi to your home wifi easier.

Tested on Stretch and Raspberry Pi 3

## RPI 4 Note:

I realize that a bunch of folks will try this out using the new Raspberry Pi 4. I caution you that this is not something I have tried, I believe this was tested on a Raspberry Pi 3 to success. However, if you find that this works on a Raspberry Pi 4, please let me know and I will adjust the README accordingly. If it does not work, it is probably a few PRs away from success :)

## Why?

When unable to connect to a wifi network, this service will turn the Raspberry Pi into a wireless AP (Access Point). This allows us to connect to it via a phone or other device and configure our home wifi network (for example).

Once configured, it prompts the PI to reboot with the appropriate wifi credentials. If this process fails, it immediately re-enables the PI as an AP which can be configurable again.

This project broadly follows these [instructions](https://www.raspberrypi.org/documentation/configuration/wireless/access-point-routed.md) in setting up a RaspberryPi as a wireless AP.

## Requirements

The NodeJS modules required are pretty much just `underscore`, `async`, and `express`.

The web application requires `angular` and `font-awesome` to render correctly. To make the deployment of this easy, one of the other requirements is `bower`.

If you do not have `bower` installed already, you can install it globally by running: `sudo npm install bower -g`.

## Install

```sh
$ git clone https://github.com/Dennis14e/raspberry-wifi-conf.git
$ cd raspberry-wifi-conf
$ npm update
$ bower install
$ sudo npm run-script provision
$ sudo npm start
```


## Setup the app as a service

There is a startup script included to make the server starting and stopping easier. Do remember that the application is assumed to be installed under `/opt/raspberry-wifi-conf`. Feel free to change this in the `assets/systemd/raspberry-wifi-conf.service` file.

```sh
$ sudo cp assets/systemd/raspberry-wifi-conf.service /etc/systemd/system/raspberry-wifi-conf.service
$ sudo systemctl daemon-reload
$ sudo systemctl enable raspberry-wifi-conf.service
$ sudo systemctl start raspberry-wifi-conf.service
```

### Gotchas

#### `dhcpcd`

Latest versions of raspbian use dhcpcd to manage network interfaces, since we are running our own dhcp server, if you have dhcpcd installed - make sure you deny the wifi interface as described in the installation section.

TODO: Handle this automatically.

## Usage

This is approximately what occurs when we run this app:

1. Check to see if we are connected to a wifi AP
2. If connected to a wifi, do nothing -> exit
3. (if not wifi, then) Convert RPI to act as an AP (with a configurable SSID)
4. Host a lightweight HTTP server which allows for the user to connect and configure the RPIs wifi connection. The interfaces exposed are RESTy so other applications can similarly implement their own UIs around the data returned.
5. Once the RPI is successfully configured, reset it to act as a wifi device (not AP anymore), and setup it's wifi network based on what the user selected.
6. At this stage, the RPI is named, and has a valid wifi connection which it is now bound to.

Typically, I have the following line in my `/etc/rc.local` file:
```
cd /home/pi/raspberry-wifi-conf
sudo /usr/bin/node server.js
```

Note that this is run in a blocking fashion, in that this script will have to exit before we can proceed with others defined in `rc.local`. This way I can guarantee that other services which might rely on wifi will have said connection before being run. If this is not the case for you, and you just want this to run (if needed) in the background, then you can do:

```
cd /home/pi/raspberry-wifi-conf
sudo /usr/bin/node server.js < /dev/null &
```

## User Interface

In my config file, I have set up the static ip for my PI when in AP mode to `192.168.44.1` and the AP's broadcast SSID to `rpi-config-ap`. These are images captured from my osx dev box.

Step 1: Power on Pi which runs this app on startup (assume it is not configured for a wifi connection). Once it boots up, you will see `rpi-config-ap` among the wifi connections.  The password is configured in config.json.

<img src="https://raw.githubusercontent.com/Dennis14e/public-images/master/raspberry-wifi-conf/wifi_options.png" width="200px" height="160px">

Step 2: Join the above network, and navigate to the static IP and port we set in config.json (`http://192.168.44.1:88`), you will see:

<img src="https://raw.githubusercontent.com/Dennis14e/public-images/master/raspberry-wifi-conf/ui.png" width="404px" height="222px">

Step 3: Select your home (or whatever) network, punch in the wifi passcode if any, and click `Submit`. You are done! Your Pi is now on your home wifi!!

## Testing
