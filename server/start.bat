rem @echo off
@set day=%Date:~-4%-%Date:~-7,-5%-%Date:~-10,-8%-%time:~-11,-9%h%time:~-8,-6%m%time:~-5,-3%s
@set file=%Date:~-4%-%Date:~-7,-5%-%Date:~-10,-8%
set log=log\TallyReporter_%file%.log
set logerr=log\TallyReporter_err_%file%.log
node index.js > %log% 2> %logerr%
