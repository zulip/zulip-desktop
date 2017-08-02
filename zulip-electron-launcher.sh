#!/bin/bash

# Zulip Beta Client Launcher

# This script ensures that you have the latest version of the specified branch
# (defaults to master if none specified) and then updates or installs all your
# required npm modules.

# I recommend symlinking this script into your PATH.

# {{{ showUsage()

showUsage()
{
	echo "Usage: $0 <branch_name>"
	echo "Example: $0 dev"
	exit 1
}

# }}}
# {{{ envSetup()

envSetup()
{
	defaultBranch="master"
	startingDir=`pwd`
	requirePop=0

	# Check command line arguments
	if [ "$#" -gt "1" ]
	then
		showUsage
	elif [ "$#" -eq "1" ]
	then
		myBranch=$1
	else
		myBranch=$defaultBranch
	fi

	# Set workingDir
	if [ -L $0 ]
	then
		realPath=`ls -l $0 | cut -d '>' -f 2`
		workingDir=`dirname $realPath`
	else
		workingDir="."
	fi

	# Set name of upstreamRemote
	cd $workingDir
	git remote -v | grep "github\.com.zulip.zulip-electron.git (fetch)" > /dev/null 2>&1
	if [ $? -eq 0 ]
	then
		upstreamRemote=`git remote -v | grep "github\.com.zulip.zulip-electron.git (fetch)" | awk '{ print $1 }'`
	else
		upstreamRemote="origin"
	fi
}

# }}}
# {{{ gitCheckout()

gitCheckout()
{
	git fetch $upstreamRemote
	git checkout $myBranch
	git rebase $upstreamRemote/master
	if [ $? -gt 0 ]
	then
		echo "Stashing uncommitted changes and doing a new git pull"
		git stash && requirePop=1
		git rebase $upstreamRemote/master
	fi
}

# }}}
# {{{ npmInstallStart()

npmInstallStart()
{
	npm install
	npm start &
}

# }}}
# {{{ cleanUp()

cleanUp()
{
	# Switch back to branch we started on
	git checkout -

	# Pop if we stashed
	if [ $requirePop -eq 1 ]
	then
		echo "Popping out uncommitted changes"
		git stash pop
	fi

	# Return the whatever dir we started in
	cd $startingDir
}

# }}}

# this function is called when user hits Ctrl-C
catchControl_c () {
    echo -en "\n## Ctrl-C caught; Quitting \n"
    # exit shell script
    exit $?;
}



envSetup $*
gitCheckout
npmInstallStart
cleanUp

# initialise trap to call catchControl_c function and trap keyboard interrupt (control-c)
trap catchControl_c SIGINT
sleep 1000