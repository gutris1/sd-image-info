from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs
import modules.infotext_utils as tempe
from modules import shared
import gradio as gr
import os

L = 'sd_image_info_layout'

shared.options_templates.update(shared.options_section(('SDImageInfo-Setting', 'SD Image Info'), {
    L: shared.OptionInfo(
        'default', '',
        gr.Radio, lambda: {'choices': ['default', 'full width']}
    ),
}))

if shared.opts.data.get(L) == 'side by side': shared.opts.data[L] = 'default'

def saveLayout(v):
    if shared.opts.set(L, v): shared.opts.save(shared.config_filename)

def nonLocal():
    return any(k in os.environ for k in (
        'COLAB_JUPYTER_TOKEN',
        'SAGEMAKER_INTERNAL_IMAGE_URI',
        'KAGGLE_DATA_PROXY_TOKEN',
    ))

def tab():
    with gr.Blocks(analytics_enabled=False) as sd_image_info:
        with gr.Column(variant='compact', elem_id='SDImageInfo-Column'), gr.Row(equal_height=False, elem_id='SDImageInfo-Row'):
            with FormColumn(variant='compact', scale=3, elem_id='SDImageInfo-Image-Column'):
                image = gr.Image(elem_id='SDImageInfo-Image', type='pil', source='upload', show_label=False)
                image.change(fn=None, _js='() => SDImageInfoParser()')

                with FormRow(variant='compact', elem_id='SDImageInfo-SendButton'):
                    buttons = tempe.create_buttons(['txt2img', 'img2img', 'inpaint', 'extras'])

            with FormColumn(variant='compact', scale=7, elem_id='SDImageInfo-Output-Panel'):
                geninfo = gr.Textbox(elem_id='SDImageInfo-Geninfo', visible=False)
                box = gr.Textbox(elem_id='SDImageInfo-Box', visible=False)
                box.change(saveLayout, box, None)

                gr.HTML(f"""<div id='SDImageInfo-ENV'>{nonLocal()}</div>""", elem_id='SDImageInfo-HTML')

            with FormColumn(variant='compact', elem_id='SDImageInfo-Config-Column'):
                gr.Radio(
                    ['default', 'full width'],
                    value='default',
                    show_label=False,
                    interactive=True,
                    elem_id='SDImageInfo-Config-Radio',
                    elem_classes='sdimginfo-radio'
                )

        for tabname, button in buttons.items():
            tempe.register_paste_params_button(
                tempe.ParamBinding(
                    paste_button=button, 
                    tabname=tabname, 
                    source_text_component=geninfo, 
                    source_image_component=image
                )
            )

    return [(sd_image_info, 'Image Info', 'SDImageInfo')]

on_ui_tabs(tab)