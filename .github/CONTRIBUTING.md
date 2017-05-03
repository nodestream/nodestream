# Contributing guidelines

First of all, thanks for your past, current and/or future contribution to this project! Here are some things to keep in mind when sending pull requests for review.

## Issues

Please include the following in your bug/issue description:

- Versions of all nodestream components used (nodestream, used adapter, used transforms)
- Which adapter you use
- Which transform plugins you use and in what order and configuration

If your issue is not a bug report, feel free to not include the information described above and simply ask a question/suggestion/other. 😀

## Pull Requests

### Make sure it works

`make test`

- When forking the project, make sure tests pass
- When working on a new feature/bugfix/other change, include test(s) which verify your functionality
- Before sending pull request, make sure tests still pass

If you are about to open a pull request which does not yet have all tests passing, state this in the pull request's description and include a brief note about what is needed to get it working (Perhaps you need help? Or the feature will require much more work?).

### Make sure static code checker is happy

`make lint`

- Always adhere to the rules set forth by the static code checker/linter
- Try to write code in a similar style which is used throughout the project

### Don't forget to update documentation

Good code is only 50% of the job! Good documentation is a requirement for any successful project.
