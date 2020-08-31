const eventBridgeClient = require("./eventBridgeClient");
const cloudFormationClient = require("./cloudFormationClient");

async function create(event) {
  const body = JSON.parse(event.body);
  const token = body.token;
  const localRule = body.localRule;

  const ruleName = eventBridgeClient.getRuleName(localRule.EventBusName);
  const eventConsumerName = await cloudFormationClient.getEventConsumerName();

  try {
    await eventBridgeClient.putRule(
      localRule.EventBusName,
      localRule,
      ruleName
    );
    console.log(eventConsumerName, localRule, body, token);
    const targets = [];
    for (const target of localRule.Targets || [localRule.Target]) {
      targets.push(
        eventBridgeClient.createTarget(
          eventConsumerName,
          target,
          body.targetId,
          token
        )
      );
    }

    await eventBridgeClient.putTargets(
      localRule.EventBusName,
      ruleName,
      targets
    );
  } catch (err) {
    return { error: err };
  }

  return [ruleName];
}

module.exports = {
  create,
};
