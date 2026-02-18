pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('docker-hub_creds')
        DOCKER_USERNAME = 'himaneeshj'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git 'https://github.com/Dinesh-1208/shadowCanvas.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh "docker build -t $DOCKER_USERNAME/shadowcanvas-backend ./backend"
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh "docker build -t $DOCKER_USERNAME/shadowcanvas-frontend ./frontend"
            }
        }

        stage('Docker Login & Push') {
            steps {
                sh """
                echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_USERNAME --password-stdin
                docker push $DOCKER_USERNAME/shadowcanvas-backend
                docker push $DOCKER_USERNAME/shadowcanvas-frontend
                """
            }
        }

        stage('Deploy on EC2') {
            steps {
                sh """
                docker stop backend || true
                docker stop frontend || true

                docker rm backend || true
                docker rm frontend || true

                docker pull $DOCKER_USERNAME/shadowcanvas-backend
                docker pull $DOCKER_USERNAME/shadowcanvas-frontend

                docker run -d --name backend -p 5000:5000 $DOCKER_USERNAME/shadowcanvas-backend
                docker run -d --name frontend -p 80:80 $DOCKER_USERNAME/shadowcanvas-frontend
                """
            }
        }
    }
}
