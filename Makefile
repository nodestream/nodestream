# Default target
all: install lint test docs coverage

include targets/nodejs/*.mk
include targets/shared/*.mk

# Project-specific information
ghuser = Alaneor
lintfiles = lib test
platform_t = v5.9

# Define version constraints
gh-pages: platform-version
coveralls: platform-version

# This file allows local Make target customisations without having to worry about them being
# accidentally commited to this file. local.mk is in gitignore. If this file does not exist, make
# Make not to panic.
-include local.mk
