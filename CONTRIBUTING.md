#Contributing Guidelines

Thanks for taking the time to contribute!

The following is a set of guidelines for contributing to zulip-electron. These are just guidelines, not rules, use your best judgement and feel free to propose changes to this document in a pull request.

## Getting Started

Zulip-Desktop app is built on top of [Electron](http://electron.atom.io/). If you are new to Electron please head over to [this](http://jlord.us/essential-electron/) great article.

## Community

* We have
[a public mailing list](https://groups.google.com/forum/#!forum/zulip-devel)
that is currently pretty low traffic because most discussions happen
in our public Zulip instance.  We use it to announce Zulip developer
community gatherings and ask for feedback on major technical or design
decisions.  It has several hundred subscribers, so you can use it to
ask questions about features or possible bugs, but please don't use it
ask for generic help getting started as a contributor (e.g. because
you want to do Google Summer of Code).

* Zulip also has a [blog](https://blog.zulip.org/) and
  [twitter account](https://twitter.com/zuliposs).

* Last but not least, we use [GitHub](https://github.com/zulip/zulip)
to track Zulip-related issues (and store our code, of course).
Anybody with a GitHub account should be able to create Issues there
pertaining to bugs or enhancement requests.  We also use Pull Requests
as our primary mechanism to receive code contributions.

The Zulip community has a [Code of Conduct](https://zulip.readthedocs.io/en/latest/code-of-conduct.html).

## Issue
Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/zulip/zulip-electron/issues). If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/zulip/zulip-electron/issues/new). Please pay attention to following points while opening an issue.

The [Zulipbot](https://github.com/zulip/zulipbot) helps to claim the issue by commenting the following in the comment section: "**@zulipbot** claim". **@zulipbot** will assign you to the issue and label the issue as **in progress**. For more details, check out [**@zulipbot**](https://github.com/zulip/zulipbot).

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