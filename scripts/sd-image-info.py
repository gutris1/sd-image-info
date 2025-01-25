import modules.generation_parameters_copypaste as tempe  # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs
import gradio as gr

def onSDImageInfoTab():
    with gr.Blocks(analytics_enabled=False) as sd_image_info, FormRow(equal_height=False):
        with FormColumn(variant="compact", scale=3):
            image = gr.Image(
                elem_id="imgInfoImage",
                type="pil",
                source="upload",
                show_label=False
            )

            with FormRow(variant="compact", elem_id="imgInfoSendButton"):
                buttons = tempe.create_buttons(
                    ["txt2img", "img2img", "inpaint", "extras"]
                )

        with FormColumn(variant="compact", scale=7, elem_id="imgInfoOutputPanel"):
            geninfo = gr.Textbox(
                elem_id="imgInfoGenInfo",
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

        image.change(fn=None, _js="() => {SDImageInfoParser();}")

    return [(sd_image_info, "Image Info", "sd_image_info")]

on_ui_tabs(onSDImageInfoTab)
print("\033[38;5;208m▶\033[0m SD Image Info")
