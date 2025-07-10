FROM eclipse-temurin:17-jdk-jammy as builder
WORKDIR /opt/app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY ./src ./src
RUN ./mvnw clean install -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /opt/app
EXPOSE 8080
EXPOSE 5003
COPY --from=builder /opt/app/target/*.jar /opt/app/*.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /opt/app/*.jar"]