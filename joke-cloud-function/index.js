const iot = require("@google-cloud/iot");
const t2s = require("@google-cloud/text-to-speech");
const cloudRegion = "us-central1";
const projectId = "text2speech-254918";
const registryId = "my-registry";
const deviceId = "my-node-device";

exports.getAudioContent = (req, res) => {
  getAudioContent();
  res.send("Hello, World");
};

exports.text2speech = async data => {
  try {
    console.log("Getting audio content");

    let audioContent = await getAudioContent();

    const iotClient = new iot.v1.DeviceManagerClient();

    const formattedName = iotClient.devicePath(
      projectId,
      cloudRegion,
      registryId,
      deviceId
    );

    // NOTE: The device must be subscribed to the wildcard subfolder
    // or you should specify a subfolder.
    const request = {
      name: formattedName,
      binaryData: audioContent
    };
    console.log("Sending command");

    await iotClient.sendCommandToDevice(request);

    console.log("Sent command");
  } catch (err) {
    console.error(err);
  }
};

async function getAudioContent() {
  const t2sClient = new t2s.TextToSpeechClient();

  // The text to synthesize
  const text = "Hello, world!";

  // Construct the request
  const request = {
    input: { text: text },
    // Select the language and SSML Voice Gender (optional)
    voice: { languageCode: "es-ES", name: "es-ES-Standard-A" },
    // Select the type of audio encoding
    audioConfig: { audioEncoding: "MP3" }
  };

  // Performs the Text-to-Speech request
  const [response] = await t2sClient.synthesizeSpeech(request);

  // Return the binary audio content
  console.log("Audio content returned!");

  return response.audioContent;
}
