pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        DOCKER_USERNAME = 'yourdockerhubusername'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git 'https://github.com/Dinesh-1208/shadowCanvas.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh """
                docker build -t $DOCKER_USERNAME/shadowcanvas-backend ./backend
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                docker build -t $DOCKER_USERNAME/shadowcanvas-frontend ./frontend
                """
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
    }
}
