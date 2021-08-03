:: REQUIRES GLOBAL INSTALL OF GITBOOK and GITBOOK-CLI
::
:: Call this script from the command line while in the directory of the book
:: you want to actively edit + preview
::
:: `gitbook serve` can break with permission issues on Windows for misc.
:: machines. This script is a workaround. When `gitbook serve` fails, it silently
:: restarts it.
:: https://github.com/GitbookIO/gitbook/issues/1379#issuecomment-288048275
@Echo off
:Start
call gitbook serve
goto Start