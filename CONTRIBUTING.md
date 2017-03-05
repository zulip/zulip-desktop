#Contributing Guidelines

Thanks for taking the time to contribute!

The following is a set of guidelines for contributing to zulip-electron. These are just guidelines, not rules, use your best judgement and feel free to propose changes to this document in a pull request.

## Getting Started

Zulip-Desktop app is built on top of [Electron](http://electron.atom.io/). If you are new to Electron please head over to [this](http://jlord.us/essential-electron/) great article.

## Chat
Feel free to reach us out at [Zulip-Chat](https://chat.zulip.org) in the 'electron' section.

## Issue
Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/zulip/zulip-electron/issues). If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/zulip/zulip-electron/issues/new). Please pay attention to following points while opening an issue.

Also make sure to claim the issue by commenting the following in the comment section:
"**@zulipbot** claim". **@zulipbot** will assign you to the issue and label the issue as **in progress**. For more details, check out [**@zulipbot**](https://github.com/zulip/zulipbot).

### Does it happen on web browsers? (especially Chrome)
Zulip-Desktop is based on Electron, which integrates the Chrome engine within a standalone application.
If the problem you encounter can be reproduced on web browsers, it may be an issue with Zulip web app.

### Write detailed information
Detailed information is very helpful to understand the problem.

For example:
* How to reproduce, step-by-step
* Expected behavior (or what is wrong)
* Screenshots (for GUI issues)
* Application version
* Operating system
* Zulip-Desktop version


## Pull Requests
Pull Requests are welcome. 

1. When you edit the code, please run `npm run test` to check formatting of your code before git commit.
2. Ensure the PR description clearly describes the problem and solution. It should include:
   * Operating System version on which you tested
   * Zulip-Desktop version on which you tested
   * The relevant issue number if applicable