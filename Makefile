bin = node_modules/.bin/
targets := $(wildcard packages/*/test)
# Put this into your local.mk to add extra flags for Mocha
# test-glags = --inspect

install: node_modules
	$(bin)lerna bootstrap

pristine: distclean
	@rm -rf node_modules
	@find packages -maxdepth 2 -name node_modules -type d -print -exec rm -rf {} \;

compile: install
	$(bin)babel packages --out-dir packages --source-maps both --ignore node_modules --quiet

node_modules: package.json
	npm install

lint:
	$(bin)eslint --ext .es packages

test: $(targets)

packages/*/test: compile
	$(bin)mocha --opts mocha.opts $(test-flags) $@

coverage:
	$(bin)nyc $(MAKE) test-all

coveralls: coverage
	cat coverage/lcov.info | $(bin)coveralls

clean:
	rm -rf .nyc_output
	rm -rf coverage
	rm -rf docs

# Delete all the .js and .js.map files (excluding any potential dotfiles with .js extension)
distclean: clean
	@find packages \
		-not -path "*/node_modules/*" \
		-not -name '.*.js' \
		\( -name '*.js' -or -name '*.js.map' \) \
		-print -delete

# This file allows local Make target customisations without having to worry about them being
# accidentally commited to this file. local.mk is in gitignore. If this file does not exist, make
# Make not to panic.
-include local.mk

.PHONY: compile lint coverage $(targets)
