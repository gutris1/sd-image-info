import modules.generation_parameters_copypaste as tempe  # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules import script_callbacks
import gradio as gr

def on_ui_tabs():
    with gr.Blocks(analytics_enabled=False) as sd_image_info:
        with FormRow(equal_height=False):
            with FormColumn(variant="compact", scale=3):
                image = gr.Image(
                    elem_id="imgInfoImage",
                    source="upload",
                    interactive=True,
                    type="pil",
                    show_label=False
                )

                with FormRow(variant="compact", elem_id="imgInfoSendButton"):
                    buttons = tempe.create_buttons(["txt2img", "img2img", "inpaint", "extras"])

            with FormColumn(variant="compact", scale=7, elem_id="imgInfoOutputPanel"):
                geninfo = gr.Textbox(
                    elem_id="imgInfoGenInfo", 
                    label="RAW", 
                    visible=False
                )
                gr.HTML(elem_id="imgInfoHTML")

            for tabname, button in buttons.items():
                tempe.register_paste_params_button(
                    tempe.ParamBinding(
                        paste_button=button, 
                        tabname=tabname, 
                        source_text_component=geninfo, 
                        source_image_component=image
                    )
                )

        image.change(
            fn=None, 
            inputs=[], 
            outputs=[], 
            _js="() => {image_info_parser();}"
        )

    return [(sd_image_info, "Image Info", "sd_image_info")]

script_callbacks.on_ui_tabs(on_ui_tabs)
print("\033[38;5;208m▶\033[0m SD Image Info")
