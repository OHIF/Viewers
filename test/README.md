# Tests suite

## Tools
+ mocha as test runner. 
    + ~~meteor package: practicalmeteor:mocha 
    https://github.com/practicalmeteor/meteor-mocha~~
    + meteor package: cultofcoders:mocha 
    https://github.com/cult-of-coders/meteor-mocha
    + Using cultofcoders because of this issue: https://github.com/practicalmeteor/meteor-mocha/issues/100

+ chai as assertion library meteor package:
    + practicalmeteor:chai https://github.com/practicalmeteor/meteor-chai

+ sinon as stubs, spies & mocking lib 
    + practicalmeteor:meteor-sinon

+ meteor-coverage as tests coverage report (istanbul.js based) 
    + https://atmospherejs.com/lmieulet/meteor-coverage

+ xolvio:template-isolator 
    + Used for mock events on client side, like 'button click'.

+ spacejam:
    + Use it when you want run tests in a CI server. It has no browser dependency.
    + https://www.npmjs.com/package/spacejam

## Useful links
1. https://guide.meteor.com/testing.html
2. https://guide.meteor.com/writing-atmosphere-packages.html#testing

## Usage

```
$ cd Viewers
$ ./test/testPackages.sh [-c] -s
# -c for coverage | -s for spacejam
```

You can add more packages to be tested changing the line 7 in `testPackages.sh`:
```
TEST_PACKAGES=./Packages/ohif-viewerbase ./Packages/ohif-core ./Packages/ohif-etc
```

it does not work using path patterns like `./Packages/*` or `./Packages/`

Just open  `http://localhost:3000` in your browser. The page going to be refreshed everytime you change the code.

Note: if you want to use spacejam, just install it before running. 


