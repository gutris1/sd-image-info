import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs
from modules import shared
import gradio as gr

def onSDImageInfoTab():
    with gr.Blocks(analytics_enabled=False) as sd_image_info:
        with FormRow(equal_height=False, elem_id='SDImageInfo-Column'):
            with FormColumn(variant='compact', scale=3, elem_id='SDImageInfo-Image-Column'):
                image = gr.Image(elem_id='SDImageInfo-Image', type='pil', source='upload', show_label=False)
                image.change(fn=None, _js='() => { SDImageInfoParser(); }')

                with FormRow(variant='compact', elem_id='SDImageInfo-SendButton'):
                    buttons = tempe.create_buttons(['txt2img', 'img2img', 'inpaint', 'extras'])

            with FormColumn(variant='compact', scale=7, elem_id='SDImageInfo-Output-Panel'):
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

    return [(sd_image_info, 'Image Info', 'SDImageInfo-Tab')]

shared.options_templates.update(shared.options_section(('SDImageInfo-Setting', 'SD Image Info'), {
    'sd_image_info_layout': shared.OptionInfo('fullwidth', '', gr.Radio, lambda: {'choices': ['fullwidth', 'side by side']}),
}))

on_ui_tabs(onSDImageInfoTab)