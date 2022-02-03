import { Component, Input, OnInit } from '@angular/core';
import { EtsiMessage } from 'src/app/models/etsi-message.model';

@Component({
  selector: 'app-event-icon',
  templateUrl: './event-icon.component.html',
  styleUrls: ['./event-icon.component.css']
})
export class EventIconComponent implements OnInit {

  @Input() event!: EtsiMessage;

  constructor() { }

  ngOnInit(): void {
  }

}
