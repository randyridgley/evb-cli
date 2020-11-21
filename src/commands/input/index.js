const program = require("commander");
const AWS = require("aws-sdk");
const authHelper = require("../shared/auth-helper");
const builder = require("./input-transformer-builder");

program
  .command("input")
  .alias("i")
  .option("-f, --format <json|yaml>", "Select output format", "json")
  .option("-p, --profile [profile]", "AWS profile to use")
  .option("--region [region]", "The AWS region to use. Falls back on AWS_REGION environment variable if not specified")
  .description("Starts an EventBridge InputTransformer builder")
  .action(async (cmd) => {
    authHelper.initAuth(cmd);
    const schemaApi = new AWS.Schemas();
    await builder.build(cmd.format, schemaApi);
  });
