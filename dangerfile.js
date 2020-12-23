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

