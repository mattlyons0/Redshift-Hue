Redshift-Hue
============
An application designed to mimic the color temperature of sunrise and sunset by mirroring Redshift (Similar to f.lux) colors on the Philips Hue with detection of out of program changes and a webhook for resuming mirroring.

### Usage
- Clone Repository
- Run `npm install` to install dependencies
- Execute with `node Redshift-Hue`
  - Upon first run of application Hue bridge will be detected, paired and settings saved (with stdin/stdout prompts for user input)
- Once configured in order to enable Redshift mode on configured light bulb POST to localhost:5000 with the body `resume`
- If the light bulb color is changed by any other script Redshift will automatically disable monitoring until a POST request with `resume` is sent
- It is recommended to keep script running persistently by using some sort of process manager
  - I usually write a simple Systemd script and enable it (this also will enable logging through journalctl)

### Use Cases
- Amazon Dash Button Trigger
  - [Detect Button Press](https://www.raspberrypi.org/magpi/hack-amazon-dash-button-raspberry-pi/) and then POST to localhost:5000 with body `resume` to trigger Redshift mode
- Google Home / Amazon Echo
  - Configure [IFTTT](https://ifttt.com/) with your device and use the [Webhooks](https://ifttt.com/maker_webhooks) block to make a POST request with body `resume`
    - This will require forwarding port 5000 and exposing it to the internet
