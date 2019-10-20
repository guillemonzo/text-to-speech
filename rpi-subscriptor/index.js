'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');


const subscribe = (
  deviceId,
  registryId,
  projectId,
  region,
  algorithm,
  privateKeyFile,
  mqttBridgeHostname,
  mqttBridgePort
) => {

  console.log('Starting subscriptor...');
  console.log(deviceId);
  // const cloudRegion = 'us-central1';
  // const projectId = 'text2speech-254918';
  // const registryId = 'my-registry';
  // const deviceId = 'my-device';

  // The mqttClientId is a unique string that identifies this device. For Google
  // Cloud IoT Core, it must be in the format below.
  const mqttClientId = `projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}`;

  // With Google Cloud IoT Core, the username field is ignored, however it must be
  // non-empty. The password field is used to transmit a JWT to authorize the
  // device. The "mqtts" protocol causes the library to connect using SSL, which
  // is required for Cloud IoT Core.
  const connectionArgs = {
    host: mqttBridgeHostname,
    port: mqttBridgePort,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(projectId, privateKeyFile, algorithm),
    protocol: 'mqtts',
    secureProtocol: 'TLSv1_2_method',
  };

  // Create a client, and connect to the Google MQTT bridge.
  const client = mqtt.connect(connectionArgs);

  // Subscribe to the /devices/{device-id}/commands/# topic to receive all
  // commands or to the /devices/{device-id}/commands/<subfolder> to just receive
  // messages published to a specific commands folder; we recommend you use
  // QoS 0 (at most once delivery)
  client.subscribe(`/devices/${deviceId}/commands/#`, { qos: 0 });


  client.on('connect', success => {
    console.log('connect');
    if (!success) {
      console.log('Client not connected...');
    } else {
      console.log('Client connected!');
    }
  });

  client.on('close', () => {
    console.log('close');
  });

  client.on('error', err => {
    console.log('error', err);
  });

  client.on('message', (topic, message) => {
    let messageStr = 'Message received: ';
    if (topic.startsWith(`/devices/${deviceId}/commands`)) {
      messageStr = 'Command message received: ';
    }

    messageStr += Buffer.from(message, 'base64').toString('ascii');
    console.log(messageStr);
  });

  // Once all of the messages have been published, the connection to Google Cloud
  // IoT will be closed and the process will exit. See the publishAsync method.
};


// Create a Cloud IoT Core JWT for the given project id, signed with the given
// private key.
const createJwt = (projectId, privateKeyFile, algorithm) => {
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: projectId,
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, { algorithm: algorithm });
};


const playAudio = (audioContent) => {

  //const fileContent = fs.readFileSync(audioContent);

  //const buff = new Buffer(fileContent, 'base64');

  var lame = require('lame');
  var Speaker = require('speaker');

  fs.createReadStream(audioContent).pipe(new lame.Decoder())
    .on('format', function () {
      console.error('format!');
    })
    .on('close', function () {
      console.error('done!');
    })
    .on('error', function () {
      console.error('error');
    })
    .on('open', function () {
      console.error('open');
    })
    .pipe(new Speaker);

};


const { argv } = require(`yargs`)
  .command(
    `playAudio`,
    `Plays a audio file`,
    {
      audioContent: {
        description:
          'The audio file',
        requiresArg: true,
        type: 'string',
      }
    },
    opts => {
      playAudio(
        opts.audioContent
      );
    }
  )
  .command(
    `subscribe`,
    `Connects a device and receives data`,
    {
      projectId: {
        default: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
        description:
          'The Project ID to use. Defaults to the value of the GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT environment variables.',
        requiresArg: true,
        type: 'string',
      },
      cloudRegion: {
        default: 'us-central1',
        description: 'GCP cloud region.',
        requiresArg: true,
        type: 'string',
      },
      registryId: {
        description: 'Cloud IoT registry ID.',
        requiresArg: true,
        demandOption: true,
        type: 'string',
      },
      deviceId: {
        description: 'Cloud IoT device ID.',
        requiresArg: true,
        demandOption: true,
        type: 'string',
      },
      privateKeyFile: {
        description: 'Path to private key file.',
        requiresArg: true,
        demandOption: true,
        type: 'string',
      },
      algorithm: {
        description: 'Encryption algorithm to generate the JWT.',
        requiresArg: true,
        demandOption: true,
        choices: ['RS256', 'ES256'],
        type: 'string',
      },
      mqttBridgeHostname: {
        default: 'mqtt.googleapis.com',
        description: 'MQTT bridge hostname.',
        requiresArg: true,
        type: 'string',
      },
      mqttBridgePort: {
        default: 8883,
        description: 'MQTT bridge port.',
        requiresArg: true,
        type: 'number',
      },
    },
    opts => {
      subscribe(
        opts.deviceId,
        opts.registryId,
        opts.projectId,
        opts.cloudRegion,
        opts.algorithm,
        opts.privateKeyFile,
        opts.mqttBridgeHostname,
        opts.mqttBridgePort
      );
    }
  ).recommendCommands().help().strict().argv;