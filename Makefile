bin = node_modules/.bin/
pkgs = packages

test-adapters = filesystem-test gcs-test gridfs-test s3-test
test-transforms = transform-checksum-test transform-compress-test transform-progress-test
test-deps = nodestream-test $(test-adapters) $(test-transforms)

# Put this into your local.mk to add extra flags for Mocha
# test-glags = --inspect

install: node_modules
	$(bin)lerna bootstrap

node_modules: package.json
	npm install

lint:
	$(bin)eslint $(pkgs)

test: $(test-deps)

nodestream-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream/test

filesystem-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-filesystem/test

gcs-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-gcs/test

gridfs-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-gridfs/test

s3-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-s3/test

transform-checksum-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-transform-checksum/test

transform-compress-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-transform-compress/test

transform-progress-test:
	$(bin)mocha --opts mocha.opts $(test-flags) $(pkgs)/nodestream-transform-progress/test

# This file allows local Make target customisations without having to worry about them being
# accidentally commited to this file. local.mk is in gitignore. If this file does not exist, make
# Make not to panic.
-include local.mk
