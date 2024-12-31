package page.crates;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class CratesApplication {

	public static void main(String[] args) {
		SpringApplication.run(CratesApplication.class, args);
	}
}
