bin = node_modules/.bin/
targets := $(wildcard packages/*/test)
# Put this into your local.mk to add extra flags for Mocha
# test-glags = --inspect

install: node_modules
	$(bin)lerna bootstrap

node_modules: package.json
	npm install

lint:
	$(bin)eslint packages

test-all: $(targets)

packages/*/test:
	$(bin)mocha --opts mocha.opts $(test-flags) $@

coverage:
	$(bin)nyc $(MAKE) test-all

coveralls: coverage
	cat coverage/lcov.info | $(bin)coveralls

# This file allows local Make target customisations without having to worry about them being
# accidentally commited to this file. local.mk is in gitignore. If this file does not exist, make
# Make not to panic.
-include local.mk

.PHONY: coverage $(targets)
