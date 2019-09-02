#!usr/bin/env sh

# Updating environments
for envFilename in $(ls environments/)
do
    env="${envFilename%%.*}"
    echo "Updating environment: $env"
	
	#updating environment
	curl --request PUT -H "Content-Type: application/json" -d @environments/$envFilename -s -w "Response status: %{http_code}\n"  http://judge-d.herokuapp.com/environments/$env -o /dev/null
done 

#Updating contracts
for conFilename in $(ls contracts/)
do
    filenameWithoutExtension="${conFilename%%.json*}"
	name="${filenameWithoutExtension%%_*}"
	version="${filenameWithoutExtension#*_}"
    echo "Updating contracts: service name - $name service version - $version"
	
	#update contracts
	curl --request POST -H "Content-Type: application/json" -d @contracts/$conFilename -s -w "Response status: %{http_code}\n" http://judge-d.herokuapp.com/contracts/services/$name/versions/$version -o /dev/null
done 