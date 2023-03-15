const { argv } = process
const date = new Date().toLocaleString()
const desc = (argv.length > 4 && argv.slice(-1)[0]) || `new commit: ${date}`

module.exports = {
  shell: [
    'git status',
    'git add .',
    `git commit -m "${desc}"`,
    // 'git push origin test',
    // 'git checkout test',
    // 'git checkout master',
    'git pull origin master',
    // 'git merge --no-ff -m "clue-now merge into master" test',
    'git push origin master',
    'git status',
  ],
}
