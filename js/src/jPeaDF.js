var jPeaDF = function(options) {
    // the default variables

    this.debug = {creation: false};
    //this.debug = false;
    this.options = {};

    this.options.h1 = (options && options.h1) || {size: 18};
    this.options.h2 = (options && options.h2) || {size: 18};
    this.options.h3 = (options && options.h3) || {size: 18};
    this.options.h4 = (options && options.h4) || {size: 18};

    this.options.font_size = (options && options.font_size) || 12;
    this.options.line_height = (options && options.line_height) || 12;
    this.options.page_size = (options && options.page_size) || 'a4';// page size defaul
    this.options.units = (options && options.unit) || 'pt';// defaultunit
    this.options.orientation = (options && options.orientation) || 'p';// default orientation
    this.options.width = this.getDimensionsPts(this.options.page_size)[0];
    this.options.height = this.getDimensionsPts(this.options.page_size)[1];
    this.options.padding_top = (options && options.padding_top) || 5;
    this.options.padding_bottom = (options && options.padding_bottom) || 5;
    this.options.padding_left = (options && options.padding_left) || 5;
    this.options.padding_right = this.getSizeByPercentage(this.options.padding_right, this.options.width, 0) || 5;
    this.options.padding_left = this.getSizeByPercentage(this.options.padding_left, this.options.width, 0) || 5;
    this.options.padding_bottom = this.getSizeByPercentage(this.options.padding_bottom, this.options.height, 0) || 5;
    this.options.padding_top = this.getSizeByPercentage(this.options.padding_top, this.options.height, 0) || 5;

    // setup the document
    this.doc = new jsPDF(this.options.orientation, this.options.units, this.options.page_size);// oreintation, inches, unit
    this.doc.setFontSize(this.options.font_size);

    this.posXStart = this.getSizeByPercentage(this.options.padding_left, this.options.width, 0);
    this.posYStart = this.getSizeByPercentage(this.options.padding_top, this.options.height, 0, 0);

    // now create and update
    this.ypos = this.options.padding_top;
    this.blocks = [];

};

// function for adding a block
jPeaDF.prototype.addItem = function(b) {
    b.setPdfObj(this);
    b.setParent(this);
    this.blocks.push(b);
}

jPeaDF.prototype.calculateSize2 = function() {
    var float_ypos = this.ypos;
    var float_ypage = this.getPage();
    var max_float_ypos = this.ypos;
    var max_float_ypage = this.getPage();

    for (var i = 0; i < this.blocks.length; i++) {
        var b = this.blocks[i];
        
        // first calculate the size and start/end points of the sub-items
        b.calculateSize2(this);
        // floating point checkpoints
        if (b.options.floating) {
            float_ypos = b.start_y_pos;
            float_ypage = b.start_y_page;
        }
        
        // set the floating point END to be the highest in the current block
        if (b.end_y_page > max_float_ypage ) {
           max_float_ypage = b.end_y_page ;
           max_float_ypos = b.end_y_pos + b.options.padding_bottom; // add the padding!
        } else if (max_float_ypage === b.end_y_page && b.end_y_pos+ b.options.padding_bottom > max_float_ypos) {
            max_float_ypage = b.end_y_page;
            max_float_ypos = b.end_y_pos + b.options.padding_bottom;// add the bottom padding
        }
        
        // repoint to start if its floating
        if (b.options.floating) {
            // save highest
            this.goToPage(float_ypage);
            this.ypos = float_ypos;
        } else {
            this.ypos = max_float_ypos;
            this.goToPage(max_float_ypage);
        }
    }



}

jPeaDF.prototype.draw2 = function() {
    this.doc.setFontSize(this.options.font_size);
    this.setColor(this.options.font_color, [0, 0, 0]);
    // draw all the children items
    for (var i = 0; i < this.blocks.length; i++) {
        var b = this.blocks[i];
        b.draw2();
    }
}

jPeaDF.prototype.setLineWidth = function(a, defaulta) {
    if (!a) {
        this.doc.setLineWidth(defaulta);
    } else {
        this.doc.setLineWidth(a);
    }
}

jPeaDF.prototype.setStyle = function(a) {
    if (!a) {
        this.doc.setFontStyle('normal');
    } else {
        this.doc.setFontStyle(a);
    }
}
jPeaDF.prototype.getPage = function() {
    return this.doc.getPage();
}

jPeaDF.prototype.goToPage = function(p) {
    this.doc.goToPage(p);
}

jPeaDF.prototype.goToNextPage = function() {

    if (this.doc.getPage() < this.doc.getPages().length - 1) {
        this.doc.goToPage(this.doc.getPage() + 1); // dont add page it already exists
    } else {
        this.doc.addPage();
    }
}

jPeaDF.prototype.getOffsetX = function(outer, inner, align, defaulta, addition, padding) {
    // if padding is an array its always lrtb
    if (!align) {
        align = defaulta;
    }
    if (align == 'c') {
        return (outer - (padding[0] + padding[1]) - inner) / 2 + addition + padding[0];
    } else if (align == 'r') {
        return (outer - (padding[0] + padding[1]) - inner) + addition + padding[0];
    } else if (align == 'l') {
        return 0 + addition + padding[0];
    }
    return addition + padding;
}

jPeaDF.prototype.getOffsetY = function(outer, inner, align, defaulta, addition, padding) {

    if (!align) {
        align = defaulta;
    }
    if (align == 'm') {
        return (outer - (padding[0] + padding[1]) - inner) / 2 + addition + padding[0];
    } else if (align == 'b') {
        return (outer - (padding[0] + padding[1]) - inner) + addition + padding[0];
    } else if (align == 't') {
        return 0 + addition + padding[0];
    }
    return addition + padding;
}

// when using soplit string- make sure PDF Font size is changed
jPeaDF.prototype.drawSplitText = function(text, font_size, line_spacing, width, height, start_pos_x, start_pos_y, padding, halign, valign, overflow) {
    var temp_yoffset = this.getOffsetY(height, line_spacing * text.length, null, valign, font_size, [padding[2], padding[3]]);
    var current_y = 0;
    for (var i = 0; i < text.length; i++) {
        var temp_xoffset = this.getOffsetX(width, this.doc.getStringUnitWidth(text[i]) * font_size, null, halign, 0, [padding[0], padding[1]]);
        // go through each line!
        this.doc.text(start_pos_x + temp_xoffset, this.ypos + temp_yoffset + current_y + start_pos_y, text[i].toString());
        current_y += line_spacing;
    }
}

jPeaDF.prototype.drawBackgrounds = function(fill, border_width, border_color, start_page, start_pos, end_page, end_pos, total_height, x, width) {
    // go to start page
    var orig_page = this.doc.getPage();
    var orig_pos = this.ypos;
    var t_page = start_page;
    var t_pos = start_pos;
    while (t_page <= end_page) {
        if (t_page < end_page) {
            if (fill) {
                this.setFill(null, fill);
                this.doc.rect(x, t_pos, width, this.options.height - this.options.padding_bottom - t_pos, 'F');// tpos will be padding_top if new page!
            }
            if (border_width) {
                this.setLineWidth(null, border_width ? border_width : 1);
                this.setLineColor(null, border_color ? border_color : [0, 0, 0]);
                this.doc.rect(x, t_pos, width, this.options.height - this.options.padding_bottom - t_pos, 'D');// tpos will be padding_top if new page!
            }
            this.goToNextPage();
            t_pos = this.options.padding_top;


        } else {
            if (fill) {
                this.setFill(null, fill);
                this.doc.rect(x, t_pos, width, end_pos - t_pos, 'F');
            }
            if (border_width) {
                this.setLineWidth(null, border_width ? border_width : 1);
                this.setLineColor(null, border_color ? border_color : [0, 0, 0]);
                this.doc.rect(x, t_pos, width, end_pos - t_pos, 'D');
            }
        }
        t_page++;
    }

    this.doc.goToPage(orig_page);
    this.ypos = orig_pos;
};


jPeaDF.prototype.setColor = function(a, defaulta) {
    if (!a) {
        this.doc.setTextColor(defaulta[0], defaulta[1], defaulta[2], defaulta[3]);
    } else if (a.length === 3) {
        this.doc.setTextColor(a[0], a[1], a[2]);
    } else if (a.length === 4) {
        this.doc.setTextColor(a[0], a[1], a[2], a[3]);
    } else {
        if (defaulta.length === 3) {
            this.doc.setTextColor(defaulta[0], defaulta[1], defaulta[2]);
        } else if (defaulta.length === 4) {
            this.doc.setTextColor(defaulta[0], defaulta[1], defaulta[2], defaulta[3]);
        }
    }
}

jPeaDF.prototype.setFill = function(a, defaulta) {
    if (!a) {
        if (defaulta.length === 3) {
            this.doc.setFillColor(defaulta[0], defaulta[1], defaulta[2]);
        } else if (defaulta.length === 4) {
            this.doc.setFillColor(defaulta[0], defaulta[1], defaulta[2], defaulta[3]);
        }

    } else if (a.length === 3) {
        this.doc.setFillColor(a[0], a[1], a[2]);
    } else if (a.length === 4) {
        this.doc.setFillColor(a[0], a[1], a[2], a[3]);
    } else {
        if (defaulta.length === 3) {
            this.doc.setFillColor(defaulta[0], defaulta[1], defaulta[2]);
        } else if (defaulta.length === 4) {
            this.doc.setFillColor(defaulta[0], defaulta[1], defaulta[2], defaulta[3]);
        }
    }
}

jPeaDF.prototype.setLineColor = function(a, defaulta) {
    if (!a) {
        this.doc.setDrawColor(defaulta[0], defaulta[1], defaulta[2], defaulta[3]);
    } else if (a.length === 3) {
        this.doc.setDrawColor(a[0], a[1], a[2]);
    } else if (a.length === 4) {
        this.doc.setDrawColor(a[0], a[1], a[2], a[3]);
    } else {
        if (defaulta.length === 3) {
            this.doc.setDrawColor(defaulta[0], defaulta[1], defaulta[2]);
        } else if (defaulta.length === 4) {
            this.doc.setDrawColor(defaulta[0], defaulta[1], defaulta[2], defaulta[3]);
        }
    }
}


// function for setting a footer

// function for adding a heading


// function for outputting document
jPeaDF.prototype.outputNewTab = function() {
    this.doc.output('dataurlnewwindow');
};

jPeaDF.prototype.output = function() {
    this.doc.output('dataurl');
};

jPeaDF.prototype.save = function(name) {
    this.doc.save(name);
};


