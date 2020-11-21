const inputUtil = require("../shared/input-util");
const templateParser = require("../shared/template-parser")
async function extractSamDefinition(template) {
  const events = [];
  Object.keys(template.Resources).filter(
    (f) =>
      template.Resources[f].Type === "AWS::Serverless::Function" &&
      template.Resources[f].Properties.Events &&
      Object.keys(template.Resources[f].Properties.Events).forEach((e) => {
        if (
          template.Resources[f].Properties.Events[e].Type ===
            "EventBridgeRule" ||
          template.Resources[f].Properties.Events[e].Type === "CloudWatchEvent"
        ) {
          events.push({
            name: `${e} -> ${f}`,
            value: {
              function: f,
              event: e,
              config: template.Resources[f].Properties.Events[e].Properties,
            },
          });
        }
      })
  );

  const extractEvent = await inputUtil.selectFrom(
    events,
    "Select SAM event to extract",
    true
  );

  delete template.Resources[extractEvent.function].Properties.Events[
    extractEvent.event
  ];

  if (
    Object.keys(template.Resources[extractEvent.function].Properties.Events)
      .length === 0
  ) {
    delete template.Resources[extractEvent.function].Properties.Events;
  }

  let suggestion = `${extractEvent.event}Rule`;
  if (template.Resources[suggestion]) {
    suggestion = `${extractEvent.event}To${extractEvent.function}Rule`;
  }
  const resourceName = await inputUtil.text("Resource name", suggestion);

  template.Resources[resourceName] = {
    Type: "AWS::Events::Rule",
    Properties: {
      EventBusName: extractEvent.config.EventBusName || "default",
      EventPattern: extractEvent.config.Pattern,
      State: "ENABLED",
      Targets: [
        {
          Arn: { "Fn::GetAtt": [extractEvent.function, "Arn"] },
          Id: suggestion,
        },
      ],
    },
  };

  if (extractEvent.config.Input) {
    template.Resources[resourceName].Properties.Targets[0].Input =
      extractEvent.config.Input;
  }
  if (extractEvent.config.InputPath) {
    template.Resources[resourceName].Properties.Targets[0].InputPath =
      extractEvent.config.InputPath;
  }
  template.Resources[`${resourceName}Permission`] = {
    Type: "AWS::Lambda::Permission",
    Properties: {
      FunctionName: {
        Ref: extractEvent.function,
      },
      Action: "lambda:InvokeFunction",
      Principal: "events.amazonaws.com",
      SourceArn: {
        "Fn::GetAtt": [suggestion, "Arn"],
      },
    },
  };

  templateParser.saveTemplate();
}

module.exports = {
    extractSamDefinition
}