import modules.generation_parameters_copypaste as tempe
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs
import gradio as gr

def onSDImageInfoTab():
    with gr.Blocks(analytics_enabled=False) as sd_image_info:
        with gr.Column(variant='compact', elem_id='SDImageInfo-Column'):
            image = gr.Image(elem_id='SDImageInfo-Image', type='pil', source='upload', show_label=False)
            image.change(fn=None, _js='() => { SDImageInfoParser(); }')

            with FormColumn(variant='compact', elem_id='SDImageInfo-OutputPanel'):
                with FormRow(variant='compact', elem_id='SDImageInfo-SendButton'):
                    buttons = tempe.create_buttons(['txt2img', 'img2img', 'inpaint', 'extras'])

                geninfo = gr.Textbox(elem_id='SDImageInfo-Geninfo', visible=False)
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

    return [(sd_image_info, 'Image Info', 'sd_image_info')]

on_ui_tabs(onSDImageInfoTab)
