import modules.generation_parameters_copypaste as tempe
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs
import gradio as gr

def onSDImageInfoTab():
    with gr.Blocks(analytics_enabled=False) as sd_image_info, FormRow(equal_height=False):
        with FormColumn(variant="compact", scale=3):
            Image = gr.HTML(elem_id="imgInfoImageContainer")

            with FormRow(variant="compact", elem_id="imgInfoSendButton"):
                Buttons = tempe.create_buttons([
                    "txt2img",
                    "img2img",
                    "inpaint",
                    "extras"
                ])

            Base64 = gr.Textbox(
                elem_id="imgInfoImageBase64",
                show_label=False,
                visible=False
            )

        with FormColumn(variant="compact", scale=7, elem_id="imgInfoOutputPanel"):
            Geninfo = gr.Textbox(
                elem_id="imgInfoGenInfo", 
                label="RAW", 
                visible=False
            )

            gr.HTML(elem_id="imgInfoHTML")

        for tabname, button in Buttons.items():
            tempe.register_paste_params_button(
                tempe.ParamBinding(
                    paste_button=button, 
                    tabname=tabname, 
                    source_text_component=Geninfo, 
                    source_image_component=Base64
                )
            )

    return [(sd_image_info, "Image Info", "sd_image_info")]

on_ui_tabs(onSDImageInfoTab)
print("\033[38;5;208m▶\033[0m SD Image Info")
