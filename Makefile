run: 
	docker run --name sabisin-matny -d -p 3000:3000 sabisin-matny

run-it:
	docker run --name sabisin-matny -it -p 3000:3000 sabisin-matny

build:
	docker build . -t sabisin-matny

build-remote:
	# docker stop sabisin-matny
	# docker rm sabisin-matny
	docker rmi sabisin-matny
	docker build . -t sabisin-matny --platform linux/amd64
	docker tag sabisin-matny gcr.io/sabisin/sabisin-matny
	docker push gcr.io/sabisin/sabisin-matny
