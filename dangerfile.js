/* global fail, warn */
import { danger } from "danger";

const { pr } = danger.github;
const bodyAndTitle = (pr.body + pr.title).toLowerCase();
const lineChanges = pr.additions + pr.deletions;
const titleRegex = /^\[.+\] (H|M|L):.+/g;

// No PR is too small to warrant a sentence or two of summary
if (pr.body.length === 0) {
  fail("Please add a description to your PR.");
}

if (!titleRegex.test(pr.title)) {
  warn(
    `Format your PR title as follows: ${titleRegex}\nFor Example: "[indigo] M: this is a medium risk change to indigo"`
  );
}

const narmiGithubPattern = /https?:\/\/github.com\/narmitech\/[^\\\n]+\/(issues|pull)\/[0-9]+/;
// https://sentry.io/organizations/narmi/issues/996270778
// https://sentry.io/narmi/banking-production/issues/608585037
const narmiSentryPattern = /https?:\/\/sentry.io(\/organizations)?\/narmi(\/[^\\\n]+)?\/issues\/[0-9]+/;
const noIssueLinks =
  !bodyAndTitle.match(/#[0-9]+/) &&
  !bodyAndTitle.match(narmiGithubPattern) &&
  !bodyAndTitle.match(narmiSentryPattern);
if (noIssueLinks && lineChanges > 25) {
  fail("Please reference at least one issue when making a nontrivial change.");
}

// Remind to rebase before merge if migrations present
const migrationsChanged =
  danger.git.modified_files.filter((f) => f.match(/migrations\/.*\.py$/))
    .length > 0;
const migrationsCreated =
  danger.git.created_files.filter((f) => f.match(/migrations\/.*\.py$/))
    .length > 0;
if (migrationsChanged || migrationsCreated) {
  const message = "This PR includes a migration.";
  const idea =
    "Please remember to rebase against github master before merging.";
  warn(`${message} - <i>${idea}</i>`);
}

// We don't compile the harland clarke java bridge during the build process
const sourceChanged = danger.git.modified_files.includes(
  "integrations/check_order/harland/NarmiHarland.java"
);
const compiledChanged = danger.git.modified_files.includes(
  "integrations/check_order/harland/NarmiHarland.class"
);
if (sourceChanged && !compiledChanged) {
  const message =
    "Changes were made to java source helpers, but not to compiled counterparts.";
  const idea = "Perhaps you need to run `javac`?";
  fail(`${message} - <i>${idea}</i>`);
}

// We don't compile the translation files during the build process, so make sure we commit them
const translationSourceChanged =
  danger.git.modified_files.filter((f) => f.match(/\.po$/)).length > 0;
const translationCompiledChanged =
  danger.git.modified_files
    .concat(danger.git.created_files)
    .filter((f) => f.match(/\.mo$/)).length > 0;
if (translationSourceChanged && !translationCompiledChanged) {
  const message =
    "Changes were made to translation source, but not to compiled counterparts.";
  const idea = "Perhaps you need to run `./manage.py compilemessages`?";
  fail(`${message} - <i>${idea}</i>`);
}

// Remind to rebuild the master banking image if python requirements change
const pythonRequirementsChanged =
  danger.git.modified_files.filter((f) => f.match(/requirements\/\w+\.txt$/))
    .length > 0;
if (pythonRequirementsChanged) {
  const message = "Changes were made to python dependencies";
  const idea =
    "Please remember to rebuild the docker image after merging: https://concourse.internal.narmitech.com/teams/main/pipelines/banking/jobs/build-master-docker-image";
  warn(`${message} - <i>${idea}</i>`);
}

// Remind to rebuild the atlas master banking image if js package.json change
const atlasPackageChanged = danger.git.modified_files.includes(
  "atlas/package.json"
);
if (atlasPackageChanged) {
  const message = "Changes were made to js dependencies";
  const idea =
    "Please remember to rebuild the docker image after merging: https://concourse.internal.narmitech.com/teams/main/pipelines/banking/jobs/build-native-master-image/";
  warn(`${message} - <i>${idea}</i>`);
}

// Remind to use set-pipeline if concourse.yml changes
const concourseChanged = danger.git.modified_files.includes("concourse.yml");
if (concourseChanged) {
  const message = "Changes were made to concourse";
  const idea =
    'Please remember to push these changes to concourse after merging by running: fly --target ci set-pipeline -p banking -c ./.concourse.yml  --var "aws_access_key=<redacted>"...';
  warn(`${message} - <i>${idea}</i>`);
}

// Remind to run client tests when updating Corelation or IBS
const CLIENT_FILES_REGEX = /.*(corelation|ibs)\/.*\.py$/;
const clientTestFilesChanged = danger.git.modified_files.filter((f) =>
  f.match(CLIENT_FILES_REGEX)
);
const clientTestFilesCreated = danger.git.created_files.filter((f) =>
  f.match(CLIENT_FILES_REGEX)
);
const clientTestFiles = clientTestFilesChanged.concat(clientTestFilesCreated);
if (clientTestFiles.length > 0) {
  warn(
    `The following IBS/Corelation files were updated. Please run the client tests (\`make test-integration\`) before merging:\n  ${clientTestFiles.join(
      "\n  "
    )}`
  );
}

// Remind to prepend python test files with test_
const pythonTestFilesChanged = danger.git.modified_files.filter((f) =>
  f.match(/.+tests\/.*\.py$/)
);
const pythonTestFilesCreated = danger.git.created_files.filter((f) =>
  f.match(/.+tests\/.*\.py$/)
);
const pythonTestFiles = pythonTestFilesChanged.concat(pythonTestFilesCreated);
const testFileWarnings = pythonTestFiles.reduce((acc, filePath) => {
  const fileName = filePath.split("/").pop();
  if (!fileName.startsWith("test_")) {
    acc.push(filePath);
  }
  return acc;
}, []);
if (testFileWarnings.length > 0) {
  warn(
    `If the following files are test files, please prepend with test_:\n  ${testFileWarnings.join(
      "\n  "
    )}`
  );
}

// Reminder to update mypy.ini with new changes to integrations/
const integrationsFilesModified = danger.git.modified_files.filter((f) =>
  f.match(/integrations.*\.py$/)
);
const integrationsFilesCreated = danger.git.created_files.filter((f) =>
  f.match(/integrations.*\.py$/)
);
const integrationsFiles = integrationsFilesModified.concat(
  integrationsFilesCreated
);
if (integrationsFiles.length > 0) {
  warn(
    `To ensure type checking coverage, please add a \`disallow_untyped_defs = True\` rule to mypy.ini that covers the files you have modified in integrations. The files are:\n  ${integrationsFiles.join(
      "\n  "
    )}`
  );
}

// Lint rules for modified JS templates
const templateFilesChanged = danger.git.modified_files.filter((f) =>
  f.match(/.+\.(vue|jsx)$/)
);
const templateFilesCreated = danger.git.created_files.filter((f) =>
  f.match(/.+\.(vue|jsx)$/)
);
const templateFiles = templateFilesChanged.concat(templateFilesCreated);
(async function checkTemplateContents(files) {
  const contents = await Promise.all(
    files.map((file) =>
      danger.github.utils
        .fileContents(file, pr.head.repo.full_name, pr.head.sha)
        .then((content) => ({ file, content }))
    )
  );

  contents.forEach(({ file, content }) => {
    if (content.length === 0) return;

    const matches = content.match(/type="number"/i);

    if (!matches) return;

    fail(`${file} contains a form input with type="number", which can cause unexpected stepping. Use type="text" \
with inputmode="numeric" or inputmode="decimal" for numeric fields instead.`);
  });
})(templateFiles);
