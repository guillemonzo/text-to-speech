const iot = require('@google-cloud/iot');
const client = new iot.v1.DeviceManagerClient();
const cloudRegion = 'us-central1';
const commandMessage = 'Hello World!';
const projectId = 'text2speech-254918';
const registryId = 'my-registry';
const deviceId = 'my-node-device';

const binaryData = Buffer.from(commandMessage).toString('base64');

const formattedName = client.devicePath(
  projectId,
  cloudRegion,
  registryId,
  deviceId
);

// NOTE: The device must be subscribed to the wildcard subfolder
// or you should specify a subfolder.
const request = {
  name: formattedName,
  binaryData: binaryData
};

exports.helloWorld = async data => {

    try {

        await client.sendCommandToDevice(request);       
        console.log('Sent command');
      
      } catch (err) {
        console.error(err);
      }

  };