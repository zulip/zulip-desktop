# Contributing Guidelines

Thanks for taking the time to contribute!

The following is a set of guidelines for contributing to Zulip Electron Desktop Client. These are just guidelines, not rules, so use your best judgement and feel free to propose changes to this document in a pull request.

## Getting Started

Zulip-Desktop app is built on top of [Electron](http://electron.atom.io/). If you are new to Electron, please head over to [this](http://jlord.us/essential-electron/) great article.

## Community

* The whole Zulip documentation, such as setting up a development environment, setting up with the Zulip webapp project, and testing, can be read [here](https://zulip.readthedocs.io).

* If you have any questions regarding zulip-electron, open an [issue](https://github.com/zulip/zulip-electron/issues/new/) or ask it on [chat.zulip.org](https://chat.zulip.org/#narrow/stream/electron).

## Issue
Ensure the bug was not already reported by searching on GitHub under [issues](https://github.com/zulip/zulip-electron/issues). If you're unable to find an open issue addressing the bug, open a [new issue](https://github.com/zulip/zulip-electron/issues/new).

The [zulipbot](https://github.com/zulip/zulipbot) helps to claim an issue by commenting the following in the comment section: "**@zulipbot** claim". **@zulipbot** will assign you to the issue and label the issue as **in progress**. For more details, check out [**@zulipbot**](https://github.com/zulip/zulipbot).

Please pay attention to the following points while opening an issue.

### Does it happen on web browsers? (especially Chrome)
Zulip's desktop client is based on Electron, which integrates the Chrome engine within a standalone application.
If the problem you encounter can be reproduced on web browsers, it may be an issue with [Zulip web app](https://github.com/zulip/zulip).

### Write detailed information
Detailed information is very helpful to understand an issue.

For example:
* How to reproduce the issue, step-by-step.
* The expected behavior (or what is wrong).
* Screenshots for GUI issues.
* The application version.
* The operating system.
* The Zulip-Desktop version.


## Pull Requests
Pull Requests are always welcome. 

1. When you edit the code, please run `npm run test` to check the formatting of your code before you `git commit`.
2. Ensure the PR description clearly describes the problem and solution. It should include:
   * The operating system on which you tested.
   * The Zulip-Desktop version on which you tested.
   * The relevant issue number, if applicable.
