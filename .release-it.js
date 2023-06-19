module.exports = {
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular",
      "infile": "CHANGELOG.md"
    }
  },
  "git": {
    "tagName": "v${version}",
    "commitMessage": "chore: release v${version}",
    "requireCleanWorkingDir": false,
    "requireBranch": "master"
  },
  "hooks": {
    "before:init": ["git pull origin master"],
  },
  "github": {
    "release": true,
    "draft": false
  },
  "npm": {
    "publish": true
  }
}