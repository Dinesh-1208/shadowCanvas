pipeline {
    agent { label 'agent-vinod' }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('docker-hub_creds')
        DOCKER_USERNAME = 'himaneeshj'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'sprint2-devops',
                    url: 'https://github.com/Dinesh-1208/shadowCanvas.git'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Lint & Audit Backend') {
            steps {
                dir('backend') {
                    sh 'npm audit || true'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t $DOCKER_USERNAME/shadowcanvas-backend ./backend'
                sh 'docker build -t $DOCKER_USERNAME/shadowcanvas-frontend ./frontend'
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                sh 'trivy image $DOCKER_USERNAME/shadowcanvas-backend || true'
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_USERNAME --password-stdin
                docker push $DOCKER_USERNAME/shadowcanvas-backend
                docker push $DOCKER_USERNAME/shadowcanvas-frontend
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                sh '''
                docker compose pull
                docker compose up -d
                '''
            }
        }
    }
}
