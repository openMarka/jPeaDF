var jPeaDFList = function(contents, options) {
    this.debug = {creation: false};
    //this.debug = false;
    this.parent = null;
    this.pdf_obj = null;
    this.options = {};
    createStandardOptions(this, options);
    this.list_data = $.extend(true, [], contents);
    // the block options
    this.options.list_type = (options && options.list_type) || 'numeric';
    this.options.list_char = (options && options.list_char) || '-';
    this.options.halign = (options && options.halign) || 'l';
    this.options.valign = (options && options.valign) || 't';
    this.options.indentInitial = (options && options.indent) || 10;
    this.options.list_gap = (options && options.list_gap) || 0;
}

jPeaDFList.prototype.setParent = function(p) {
    this.parent = p;
}

jPeaDFList.prototype.setPdfObj = function(obj) {
    this.pdf_obj = obj;
}


jPeaDFList.prototype.calculateSize2 = function(parent) {
    var obj = this.pdf_obj;
    // ****** Updating the position based on the margin//
    obj.doc.setFontSize(this.options.font_size);// set the font size of this item
    applyChildSize(parent, this); // this applies the inital widths and heights

// go to next page!
    obj.ypos = obj.ypos + this.options.margin_top;
    if (obj.ypos > obj.options.height - obj.options.padding_bottom) {
        obj.goToNextPage();
        obj.ypos = obj.options.padding_top;
    }

    this.start_y_pos = obj.ypos;
    this.start_y_page = obj.doc.getPage();

    // take into account indents!
    this.options.indent = jPeaDFGetSizeByPercentage(this.options.indentInitial, parent.options.width, parent.options.padding_left + parent.options.padding_right);// works out width AFTER the padding
    var content_width = this.options.width - this.options.padding_left - this.options.padding_right - this.options.indent;

    // add the top padding
    obj.ypos += this.options.padding_top;
    // the new height after text flow
    for (var i = 0; i < this.list_data.length; i++) {
        var lcontent = this.list_data[i];
        if(this.options.list_type ==='numeric'){
            lcontent.bullet = (i+1)+'';
        }else if(this.options.list_type ==='char'){
            lcontent.bullet = this.options.list_char;
        }else if(this.options.list_type ==='value'){
            lcontent.bullet = lcontent.bullet || '-';
        }
        var splits = obj.doc.splitTextToSize(lcontent.content.toString(), content_width, {});
        var overflow = this.options ? (this.options.overflow) : true;
        this.list_data[i].content = overflow ? splits : [splits[0]];// if there is an overflow
        this.list_data[i].height = ((this.options.line_spacing+this.options.font_size) * this.list_data[i].content.length) + this.options.list_gap;
        if (obj.ypos + lcontent.height > obj.options.height - obj.options.padding_bottom) {
            obj.goToNextPage();
            obj.ypos = obj.options.padding_top + this.options.padding_top;
        }
        if (i === 0) { // only if its the first row
            //this.start_y_pos = obj.ypos;
            //this.start_y_page = obj.doc.getPage();
        }
        obj.ypos += this.list_data[i].height;
    }
    obj.ypos += this.options.padding_bottom;// add the top and bottom paddings of the list!
    this.end_y_pos = obj.ypos;
    this.end_y_page = obj.doc.getPage();
}

jPeaDFList.prototype.draw2 = function() {

    var obj = this.pdf_obj;
    obj.setColor(this.options.font_color, [0, 0, 0]);
    obj.doc.setFontSize(this.options.font_size);

    // go to the starting page of the list!
    obj.goToPage(this.start_y_page);
    obj.ypos = this.start_y_pos;

    obj.drawBackgrounds(this.options.fill_color, this.options.border_width, this.options.border_color, this.start_y_page, this.start_y_pos, this.end_y_page, this.end_y_pos, this.total_height, this.posXStart, this.options.width);

    // add the top padding
    obj.ypos += this.options.padding_top;

    for (var i = 0; i < this.list_data.length; i++) {
        var lcontent = this.list_data[i];
        if (obj.ypos + lcontent.height > obj.options.height - obj.options.padding_bottom) {
            obj.goToNextPage();
            obj.ypos = obj.options.padding_top + this.options.padding_top;
        }
        
         obj.drawSplitText(
                [lcontent.bullet],
                this.options.font_size,
                this.options.line_spacing,
                this.options.width,
                lcontent.height,
                this.posXStart + this.options.padding_left,
                0,
                [this.options.padding_left, this.options.padding_right, 0, 0], // no need for padding top and bottom!
                this.options.halign,
                't',
                false);
        obj.drawSplitText(
                lcontent.content,
                this.options.font_size,
                this.options.line_spacing,
                this.options.width,
                lcontent.height,
                this.posXStart + this.options.padding_left + this.options.indent,
                0,
                [this.options.padding_left, this.options.padding_right, 0, 0], // no need for padding top and bottom!
                this.options.halign,
                't',
                false);
        obj.ypos += lcontent.height;

    }

    // revert to standard font!
    this.pdf_obj.doc.setFontSize(this.pdf_obj.options.font_size);
}

// recursive
jPeaDFList.prototype.drawItems = function() {
    var obj = this.pdf_obj;
    obj.setColor(this.options.font_color, [0, 0, 0]);
    obj.doc.setFontSize(this.options.font_size);
    obj.ypos = obj.ypos + this.options.margin_top;
    if (obj.ypos > obj.options.height - obj.options.padding_bottom) {
        obj.goToNextPage();
        obj.ypos = obj.options.padding_top;
    }


    var content_width = this.options.width - this.options.padding_left - this.options.padding_right - this.options.indent;
    // the new height after text flow
    var temp_height = +this.options.padding_top + this.options.padding_bottom + (this.options.font_size);
    for (var i = 0; i < this.list_data.length; i++) {
        var lcontent = this.list_data[i];
        var splits = obj.doc.splitTextToSize(lcontent.content.toString(), content_width, {});
        var overflow = this.options ? (this.options.overflow) : true;
        this.list_data[i].content = overflow ? splits : [splits[0]];// if there is an overflow
        this.list_data[i].height = (this.options.line_spacing * this.list_data[i].content.length) + this.options.list_gap;
        temp_height += (this.options.line_spacing * this.list_data[i].content.length) + this.options.list_gap;
    }
    // now calculate how manhy pages it would take
    var total_left = temp_height;
    var current_hpage = (obj.options.height - obj.options.padding_bottom) - obj.ypos; // calculate remainder space
    current_hpage = Math.min(temp_height + (this.options.font_size), current_hpage);
    total_left -= current_hpage;

    if (this.options.fill_color) {
        obj.setFill(null, this.options.fill_color);
        obj.doc.rect(this.posXStart, obj.ypos, this.options.width, current_hpage, 'F');
    }

    if (this.options.border_color) {
        obj.setLineWidth(null, this.options.border_width);
        obj.setLineColor(null, this.options.border_color);
        obj.doc.rect(this.posXStart, obj.ypos, this.options.width, current_hpage, 'D');
    }

    for (var i = 0; i < this.list_data.length; i++) {
        var lcontent = this.list_data[i];
        if (obj.ypos + lcontent.height > obj.options.height - obj.options.padding_bottom) {
            obj.goToNextPage();
            obj.ypos = obj.options.padding_top;

            // draw the new height!
            current_hpage = Math.min(obj.options.height - obj.options.padding_bottom - obj.options.padding_top, total_left + (this.options.font_size));
            total_left -= current_hpage;
            if (this.options.fill_color) {
                obj.setFill(null, this.options.fill_color);
                obj.doc.rect(this.posXStart, obj.ypos, this.options.width, current_hpage, 'F');
            }

            if (this.options.border_color) {
                obj.setLineWidth(null, this.options.border_width);
                obj.setLineColor(null, this.options.border_color);
                obj.doc.rect(this.posXStart, obj.ypos, this.options.width, current_hpage, 'D');
            }

            obj.doc.text(this.posXStart + this.options.padding_left, obj.ypos + this.options.padding_top + (this.options.font_size), '-');
            obj.drawSplitText(
                    lcontent.content,
                    this.options.font_size,
                    this.options.line_spacing,
                    this.options.width,
                    lcontent.height,
                    this.posXStart + this.options.padding_left + this.options.indent,
                    0,
                    [this.options.padding_left, this.options.padding_right, this.options.padding_top, this.options.padding_bottom],
                    this.options.halign,
                    't', false);
            obj.ypos += lcontent.height;
        } else {
            obj.doc.text(this.posXStart + this.options.padding_left, obj.ypos + this.options.padding_top + (this.options.font_size), '-');
            obj.drawSplitText(lcontent.content, this.options.font_size, this.options.line_spacing, this.options.width, lcontent.height, this.posXStart + this.options.padding_left + this.options.indent, 0, [this.options.padding_left, this.options.padding_right, this.options.padding_top, this.options.padding_bottom], this.options.halign, 't', false);

            obj.ypos += lcontent.height;
        }
    }
    // now draw the text

    // revert to standard font!

    this.block_ypos = obj.ypos + this.options.height + (this.options.font_size);
    this.block_ypage = obj.doc.getPage();

    if (this.options.floating) {
        obj.ypos = temp_ypos;
        obj.doc.goToPage(temp_page);
    }

}
