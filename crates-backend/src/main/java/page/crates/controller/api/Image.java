package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Image {
    private Long id;
    private String url;
    private Integer width;
    private Integer height;
}
