import gulp from 'gulp'
import { resolve } from 'path'
import run from 'gulp-run-command'
import sync from 'gulp-npm-script-sync'

const SOURCEFILE = resolve('.', 'index.js')
const OUTFILE = resolve('.', 'index.es5.js')

gulp.task('clean', run(`rimraf ${OUTFILE}`))
gulp.task('test', run('echo "No tests specified"'))
gulp.task('build', ['clean'], run(`babel ${SOURCEFILE} --out-file ${OUTFILE}`))

for (let versionType of ['Major', 'Minor', 'Patch']) {
  gulp.task(`publish${versionType}`, ['clean', 'build'], run(`np ${versionType.toLowerCase()}`))
}

sync(gulp)
