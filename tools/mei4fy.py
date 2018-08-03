import uuid
import sys
from mako.template import Template
import random

mei4_template = r"""\
<?xml version="1.0" encoding="UTF-8"?>
<mei ${xml_id()} xmlns="http://www.music-encoding.org/ns/mei" meiversion="N">
    <meiHead ${xml_id()} />
    <music ${xml_id()}>
        <facsimile ${xml_id()}>
            <surface ${xml_id()} ulx="0" uly="0" lrx="${lrx}" lry="${lry}">
                % for zone in zones:
                ${zone}
                % endfor
            </surface>
        </facsimile>
        <body ${xml_id()}>
            <mdiv ${xml_id()}>
                <score ${xml_id()}>
                    <scoreDef ${xml_id()}>
                        <staffGrp ${xml_id()}>
                            <staffDef ${xml_id()} n="${staffs}" lines="${stafflines}" notationtype="neume" />
                        </staffGrp>
                    </scoreDef>
                    <section ${xml_id()}>
                        <staff ${xml_id()} n="${staffs}" lines="${stafflines}">
                            <layer ${xml_id()}>
                                % for nc in neumes:
                                <syllable ${xml_id()}>
                                    <syl>${defaultsyllables[rand()]}</syl>
                                    <neume ${xml_id()}>
                                        ${nc}
                                    </neume>
                                </syllable>
                                % endfor
                            </layer>
                        </staff>
                    </section>
                </score>
            </mdiv>
        </body>
    </music>
</mei>
"""


def generate_xml_id():
    return 'xml:id="m-' + str(uuid.uuid4()) + "\""


def parse_old_mei(filename):
    content = {}
    with open(filename) as f:
        for line in f.readlines():
            if 'zone' in line:
                z = content.get('zones', [])
                z.append(line.strip())
                content['zones'] = z
            elif 'neume' in line:
                nc = line.replace('neume', 'nc')
                n = content.get('neumes', [])
                n.append(nc.strip())
                content['neumes'] = n
    return content


def get_random_boolean():
    return random.randint(0, 1);


if __name__ == '__main__':
    argc = len(sys.argv)
    if argc == 2:
        content = parse_old_mei(sys.argv[1])
    t = Template(mei4_template)
    print(t.render(
        lrx="12345",
        lry="12345",
        staffs="1",
        stafflines="0",
        xml_id=generate_xml_id,
        defaultsyllables=["", ""],
        zones=content['zones'],
        rand=get_random_boolean,
        neumes=content['neumes']))
