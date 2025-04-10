import modules.generation_parameters_copypaste as tempe
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs
import gradio as gr

def onSDImageInfoTab():
    with gr.Blocks(analytics_enabled=False) as sd_image_info:
        with FormRow(equal_height=False, elem_id='SDImageInfo-imageRow'):
            image = gr.Image(scale=3, elem_id='SDImageInfo-Image', type='pil', source='upload', show_label=False)
            geninfo = gr.Textbox(scale=7, elem_id='SDImageInfo-Geninfo')

        with FormRow(variant='compact', elem_id='SDImageInfo-SendButton'):
            buttons = tempe.create_buttons(['txt2img', 'img2img', 'inpaint', 'extras'])

        with FormColumn(variant='compact', elem_id='SDImageInfo-OutputPanel'):
            gr.HTML(elem_id='SDImageInfo-HTML')

        for tabname, button in buttons.items():
            tempe.register_paste_params_button(
                tempe.ParamBinding(
                    paste_button=button, 
                    tabname=tabname, 
                    source_text_component=geninfo, 
                    source_image_component=image
                )
            )

        image.change(fn=None, _js='() => { SDImageInfoParser(); }')

    return [(sd_image_info, 'Image Info', 'sd_image_info')]

on_ui_tabs(onSDImageInfoTab)
